export interface History {
  id: number;
  date: Date;
  command: string;
  output: string;
  username?: string;
}
