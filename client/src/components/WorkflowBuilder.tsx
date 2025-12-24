import React, { useState } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface WorkflowStep {
  type: 'word' | 'image' | 'video' | 'powerpoint';
  config: Record<string, any>;
}

interface WorkflowBuilderProps {
  lessonId: string;
  onWorkflowSave?: () => void;
}

const STEP_TYPES = [
  { id: 'word', label: 'Tạo Word Document', description: 'Xuất kịch bản thành file Word' },
  { id: 'image', label: 'Tạo Ảnh', description: 'Tạo ảnh minh họa bằng Flaton Image V1' },
  { id: 'video', label: 'Tạo Video', description: 'Tạo video bằng Flaton Video V1' },
  { id: 'powerpoint', label: 'Tạo PowerPoint', description: 'Tạo slide thuyết trình bằng Gemini + python-pptx' },
];

export default function WorkflowBuilder({ lessonId, onWorkflowSave }: WorkflowBuilderProps) {
  const { token } = useAuth();
  const [workflowName, setWorkflowName] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const addStep = (stepType: string) => {
    setSteps([
      ...steps,
      {
        type: stepType as any,
        config: stepType === 'image' ? { prompts: [] } : {},
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStepConfig = (index: number, config: Record<string, any>) => {
    const newSteps = [...steps];
    newSteps[index].config = config;
    setSteps(newSteps);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName || steps.length === 0) {
      console.log('Workflow validation: Please enter name and add at least 1 step');
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}/workflows/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workflowName,
          steps,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }
      console.log('Workflow saved successfully!');
      onWorkflowSave?.();
      setWorkflowName('');
      setSteps([]);
    } catch (error: any) {
      console.error('Error saving workflow:', error.message);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (steps.length === 0) {
      console.log('Workflow execution: Please add at least 1 step');
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/workflows/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ steps }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute workflow');
      }
      const result = await response.json();
      console.log('Workflow executed successfully!');
      console.log('Workflow result:', result);
    } catch (error: any) {
      console.error('Error executing workflow:', error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Xây dựng Quy trình</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên quy trình</label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="VD: Toán lớp 9 - Hàm số bậc hai"
          />
        </div>

      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Các bước trong quy trình</h3>

        {steps.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Chưa có bước nào. Nhấn "Thêm bước" để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-50 p-4 rounded-md border border-blue-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    Bước {index + 1}: {STEP_TYPES.find((s) => s.id === step.type)?.label}
                  </p>
                  {step.type === 'image' && step.config.prompts?.length > 0 && (
                    <p className="text-sm text-blue-700 mt-1">
                      Prompts: {step.config.prompts.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeStep(index)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Thêm bước</h3>
        <div className="grid grid-cols-2 gap-3">
          {STEP_TYPES.map((stepType) => (
            <button
              key={stepType.id}
              onClick={() => addStep(stepType.id)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              <span className="text-sm">{stepType.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveWorkflow}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          💾 Lưu Quy trình
        </button>
        <button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <Play size={18} />
            {isExecuting ? 'Đang chạy...' : 'Chạy Quy trình'}
          </span>
        </button>
      </div>
    </div>
  );
}
