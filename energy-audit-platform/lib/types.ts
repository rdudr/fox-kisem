export interface User {
  _id?: string;
  username: string;
  password: string;
  createdAt: Date;
}

export interface UserSession {
  username: string;
  loginDate: string;
  loginTime: string;
  firstActivityTime: string;
  lastActivityTime: string;
}

export interface CompanyInfo {
  companyName: string;
  companyAddress: string;
  auditorName: string;
}

export interface MachineData {
  _id?: string;
  userId: string;
  username: string;
  companyInfo: CompanyInfo;
  plant: string;
  machineType: string;
  machineName: string;
  frequency: number;
  ratedKW: number;
  ratedHP: number;
  voltage: number;
  current: number;
  kva: number;
  powerFactor: number;
  kvar: number;
  kw: number;
  calculatedPower: number;
  loadFactor: number;
  timestamp: Date;
  notes?: string;
}

export interface MachineConfig {
  plants: string[];
  machineTypes: {
    [key: string]: string[];
  };
}
