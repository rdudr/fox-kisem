import { MachineConfig } from './types';

export const machineConfig: MachineConfig = {
  plants: [
    'Plant A - Dyeing',
    'Plant B - Finishing',
    'Plant C - Processing',
    'Utility Section',
    'Compressor House',
  ],
  machineTypes: {
    'Plant A - Dyeing': [
      'Jet Machine',
      'Jigger Machine',
      'Winch Machine',
      'Padding Mangle',
    ],
    'Plant B - Finishing': [
      'Stenter Machine',
      'Calendering Machine',
      'Sanforizing Machine',
      'Raising Machine',
    ],
    'Plant C - Processing': [
      'Washing Machine',
      'Hydro Extractor',
      'Tumble Dryer',
      'Folding Machine',
    ],
    'Utility Section': [
      'Boiler',
      'Cooling Tower',
      'Chiller',
      'Air Handling Unit',
    ],
    'Compressor House': [
      'Air Compressor 1',
      'Air Compressor 2',
      'Air Compressor 3',
      'Vacuum Pump',
    ],
  },
};

export function getMachineNames(plant: string, machineType: string): string[] {
  const baseNames = machineConfig.machineTypes[plant] || [];
  
  // Generate numbered instances for each machine type
  const instances: string[] = [];
  for (let i = 1; i <= 10; i++) {
    instances.push(`${machineType} ${i}`);
  }
  
  return instances;
}
