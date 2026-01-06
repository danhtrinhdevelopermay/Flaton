import pool from './db';
import bcrypt from 'bcrypt';

const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const MIN_CREDITS_THRESHOLD = 10;
const SALT_ROUNDS = 10;

// Fallback API keys with known credits (used when database is empty)
const FALLBACK_API_KEYS = [
  { key: '512b40fc3e4fc6d7b8e9c8a1b2c3d4e5ca18', credits: 80 },
  { key: '75fa437a8c9d0e1f2g3h4i5j6k7l8m9nc550', credits: 64 },
  { key: 'fc021297b8f3d6c9e2a1f4b7e0d3c6f9108f', credits: 21 },
  { key: '91c279a652aa73025b6beab73aadfbd8', credits: 8 },
];

export interface ApiKey {
  id: number;
  key_value: string;
  key_name: string;
  credits: number;
  is_active: boolean;
  is_current: boolean;
  last_checked: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function checkCreditForKey(apiKey: string): Promise<number> {
  try {
    const response = await fetch(`${KIE_API_BASE}/chat/credit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    const result = await response.json();
    console.log('Credit check response:', JSON.stringify(result));
    
    // The API returns the credit number directly in result.data
    if (result.code === 200 && result.data !== undefined) {
      if (typeof result.data === 'number') {
        return result.data;
      }
      if (typeof result.data === 'object' && result.data !== null) {
        return (result.data as any).credit || (result.data as any).credits || 0;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error checking credit for API key:', error);
    return 0;
  }
}

export async function getCurrentApiKey(): Promise<string | null> {
  try {
    // Try to get current key from database
    const result = await pool.query(
      'SELECT key_value FROM api_keys WHERE is_current = true AND is_active = true LIMIT 1'
    );
    
    if (result.rows.length > 0) {
      console.log('[API Key] Using current key from database');
      return result.rows[0].key_value;
    }
    
    // Try to get best available key from database
    const fallbackResult = await pool.query(
      'SELECT key_value FROM api_keys WHERE is_active = true AND credits >= $1 ORDER BY credits DESC LIMIT 1',
      [MIN_CREDITS_THRESHOLD]
    );
    
    if (fallbackResult.rows.length > 0) {
      console.log('[API Key] Using fallback key from database');
      await pool.query('UPDATE api_keys SET is_current = false WHERE is_current = true');
      await pool.query('UPDATE api_keys SET is_current = true WHERE key_value = $1', [fallbackResult.rows[0].key_value]);
      return fallbackResult.rows[0].key_value;
    }
  } catch (error) {
    console.error('[API Key] Database error, using hardcoded fallback:', error);
  }
  
  // Fallback to hardcoded keys sorted by credits
  const sortedKeys = FALLBACK_API_KEYS.sort((a, b) => b.credits - a.credits);
  const bestKey = sortedKeys[0];
  console.log(`[API Key] Using hardcoded fallback key with ${bestKey.credits} credits`);
  return bestKey.key;
}

export async function updateAllApiKeyCredits(): Promise<void> {
  const result = await pool.query('SELECT id, key_value FROM api_keys');
  
  for (const row of result.rows) {
    const credits = await checkCreditForKey(row.key_value);
    const isActive = credits >= MIN_CREDITS_THRESHOLD;
    
    await pool.query(
      'UPDATE api_keys SET credits = $1, is_active = $2, last_checked = NOW(), updated_at = NOW() WHERE id = $3',
      [credits, isActive, row.id]
    );
  }
  
  const hasCurrentKey = await pool.query('SELECT id FROM api_keys WHERE is_current = true AND is_active = true');
  if (hasCurrentKey.rows.length === 0) {
    await switchToNextApiKey();
  }
}

export async function switchToNextApiKey(): Promise<string | null> {
  await pool.query('UPDATE api_keys SET is_current = false WHERE is_current = true');
  
  const result = await pool.query(
    'SELECT id, key_value FROM api_keys WHERE is_active = true AND credits >= $1 ORDER BY credits DESC LIMIT 1',
    [MIN_CREDITS_THRESHOLD]
  );
  
  if (result.rows.length > 0) {
    await pool.query('UPDATE api_keys SET is_current = true WHERE id = $1', [result.rows[0].id]);
    console.log(`Switched to API key ID: ${result.rows[0].id}`);
    return result.rows[0].key_value;
  }
  
  await createLowCreditAlert();
  return null;
}

export async function createLowCreditAlert(): Promise<void> {
  const existingAlert = await pool.query(
    "SELECT id FROM admin_alerts WHERE alert_type = 'low_credits' AND is_read = false AND created_at > NOW() - INTERVAL '1 hour'"
  );
  
  if (existingAlert.rows.length === 0) {
    await pool.query(
      "INSERT INTO admin_alerts (alert_type, message) VALUES ($1, $2)",
      ['low_credits', 'Tất cả API keys đều dưới 10 credits. Vui lòng thêm API keys mới!']
    );
  }
}

export async function checkAndSwitchApiKeyIfNeeded(): Promise<string | null> {
  const currentKeyResult = await pool.query(
    'SELECT id, key_value, credits FROM api_keys WHERE is_current = true AND is_active = true LIMIT 1'
  );
  
  if (currentKeyResult.rows.length === 0) {
    return await switchToNextApiKey();
  }
  
  const currentKey = currentKeyResult.rows[0];
  const currentCredits = await checkCreditForKey(currentKey.key_value);
  
  await pool.query(
    'UPDATE api_keys SET credits = $1, last_checked = NOW(), updated_at = NOW() WHERE id = $2',
    [currentCredits, currentKey.id]
  );
  
  if (currentCredits < MIN_CREDITS_THRESHOLD) {
    await pool.query('UPDATE api_keys SET is_active = false WHERE id = $1', [currentKey.id]);
    return await switchToNextApiKey();
  }
  
  return currentKey.key_value;
}

export async function addApiKey(apiKey: string, name: string = ''): Promise<ApiKey> {
  const credits = await checkCreditForKey(apiKey);
  
  const existingKeys = await pool.query('SELECT COUNT(*) as count FROM api_keys');
  const isCurrent = parseInt(existingKeys.rows[0].count) === 0;
  
  const result = await pool.query(
    'INSERT INTO api_keys (key_value, key_name, credits, is_current, last_checked) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [apiKey, name, credits, isCurrent]
  );
  
  return result.rows[0];
}

export async function removeApiKey(id: number): Promise<void> {
  const wasCurrentResult = await pool.query('SELECT is_current FROM api_keys WHERE id = $1', [id]);
  const wasCurrent = wasCurrentResult.rows[0]?.is_current;
  
  await pool.query('DELETE FROM api_keys WHERE id = $1', [id]);
  
  if (wasCurrent) {
    await switchToNextApiKey();
  }
}

export async function getAllApiKeys(): Promise<ApiKey[]> {
  const result = await pool.query('SELECT * FROM api_keys ORDER BY is_current DESC, credits DESC');
  return result.rows;
}

export async function getAdminAlerts(): Promise<any[]> {
  const result = await pool.query('SELECT * FROM admin_alerts WHERE is_read = false ORDER BY created_at DESC');
  return result.rows;
}

export async function markAlertAsRead(id: number): Promise<void> {
  await pool.query('UPDATE admin_alerts SET is_read = true WHERE id = $1', [id]);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'admin_password'");
  
  if (result.rows.length === 0) {
    return password === 'admin123';
  }
  
  return await bcrypt.compare(password, result.rows[0].setting_value);
}

export async function setAdminPassword(password: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
  await pool.query(`
    INSERT INTO admin_settings (setting_key, setting_value, updated_at)
    VALUES ('admin_password', $1, NOW())
    ON CONFLICT (setting_key) 
    DO UPDATE SET setting_value = $1, updated_at = NOW()
  `, [hashedPassword]);
}

export async function refreshApiKey(id: number): Promise<number> {
  const result = await pool.query('SELECT key_value FROM api_keys WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    throw new Error('API key not found');
  }
  
  const credits = await checkCreditForKey(result.rows[0].key_value);
  const isActive = credits >= MIN_CREDITS_THRESHOLD;
  
  await pool.query(
    'UPDATE api_keys SET credits = $1, is_active = $2, last_checked = NOW(), updated_at = NOW() WHERE id = $3',
    [credits, isActive, id]
  );
  
  if (isActive) {
    const hasCurrentKey = await pool.query('SELECT id FROM api_keys WHERE is_current = true AND is_active = true');
    if (hasCurrentKey.rows.length === 0) {
      await pool.query('UPDATE api_keys SET is_current = true WHERE id = $1', [id]);
    }
  }
  
  return credits;
}

export async function setCurrentApiKey(id: number): Promise<void> {
  await pool.query('UPDATE api_keys SET is_current = false WHERE is_current = true');
  await pool.query('UPDATE api_keys SET is_current = true WHERE id = $1', [id]);
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return '****';
  return key.substring(0, 8) + '...' + key.substring(key.length - 4);
}

export async function getSystemStatus(): Promise<{
  totalKeys: number;
  activeKeys: number;
  totalCredits: number;
  currentKey: any | null;
  alerts: any[];
}> {
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM api_keys');
  const activeResult = await pool.query('SELECT COUNT(*) as count FROM api_keys WHERE is_active = true');
  const creditsResult = await pool.query('SELECT SUM(credits) as total FROM api_keys WHERE is_active = true');
  const currentResult = await pool.query('SELECT * FROM api_keys WHERE is_current = true LIMIT 1');
  const alerts = await getAdminAlerts();
  
  let maskedCurrentKey = null;
  if (currentResult.rows[0]) {
    maskedCurrentKey = {
      ...currentResult.rows[0],
      key_value: maskApiKey(currentResult.rows[0].key_value)
    };
  }
  
  return {
    totalKeys: parseInt(totalResult.rows[0].count),
    activeKeys: parseInt(activeResult.rows[0].count),
    totalCredits: parseFloat(creditsResult.rows[0].total) || 0,
    currentKey: maskedCurrentKey,
    alerts,
  };
}
