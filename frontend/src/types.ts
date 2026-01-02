export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

export enum StepType {
  CreateFile = 'CreateFile',
  CreateFolder = 'CreateFolder',
  RunScript = 'RunScript',
  EditFile = 'EditFile',
}

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  code?: string;
  path?: string;
}
