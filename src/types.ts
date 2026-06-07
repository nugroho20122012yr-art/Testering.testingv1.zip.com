export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export type CrayonMode =
  | 'multi'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'violet'
  | 'brown'
  | 'black';

export interface CrayonStyleConfig {
  id: CrayonMode;
  name: string;
  colorHex: string;
  bgColor: string;
  textColor: string;
  description: string;
}
