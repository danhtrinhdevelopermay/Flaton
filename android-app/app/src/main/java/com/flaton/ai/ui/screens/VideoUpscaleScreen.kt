package com.flaton.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.flaton.ai.api.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoUpscaleScreen() {
    var videoUrl by remember { mutableStateOf("") }
    var selectedFactor by remember { mutableStateOf("4x") }
    var loading by remember { mutableStateOf(false) }
    var resultMessage by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Nâng cấp chất lượng Video",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 24.dp)
        )

        OutlinedTextField(
            value = videoUrl,
            onValueChange = { videoUrl = it },
            label = { Text("URL Video cần nâng cấp") },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("https://example.com/video.mp4") }
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text("Chọn tỷ lệ nâng cấp:", style = MaterialTheme.typography.titleSmall)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("1x", "2x", "4x").forEach { factor ->
                FilterChip(
                    selected = selectedFactor == factor,
                    onClick = { selectedFactor = factor },
                    label = { Text(factor) }
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (videoUrl.isEmpty()) {
                    resultMessage = "Vui lòng nhập URL video"
                    return@Button
                }
                loading = true
                scope.launch {
                    try {
                        val response = ApiClient.service.upscaleVideo(
                            mapOf("videoUrl" to videoUrl, "upscaleFactor" to selectedFactor)
                        )
                        resultMessage = "Đã gửi yêu cầu thành công! Task ID: ${response.taskId}"
                    } catch (e: Exception) {
                        resultMessage = "Lỗi: ${e.message}"
                    } finally {
                        loading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !loading
        ) {
            if (loading) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
            } else {
                Text("Bắt đầu nâng cấp (72 Credits)")
            }
        }

        if (resultMessage.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = resultMessage, color = if (resultMessage.contains("Lỗi")) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
        }
    }
}
