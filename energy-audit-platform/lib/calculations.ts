export function calculatePower(voltage: number, current: number, powerFactor: number): number {
  // Calculated Power = √3 × V × I × PF / 1000
  return (Math.sqrt(3) * voltage * current * powerFactor) / 1000;
}

export function calculateLoadFactor(calculatedPower: number, ratedKW: number): number {
  if (ratedKW === 0) return 0;
  return calculatedPower / ratedKW;
}

export function calculateKVA(voltage: number, current: number): number {
  // kVA = √3 × V × I / 1000
  return (Math.sqrt(3) * voltage * current) / 1000;
}

export function calculateKVAR(kva: number, kw: number): number {
  // kVAr = √(kVA² - kW²)
  return Math.sqrt(Math.pow(kva, 2) - Math.pow(kw, 2));
}

export function autoCalculate(data: {
  voltage: number;
  current: number;
  powerFactor: number;
  ratedKW: number;
}) {
  const kva = calculateKVA(data.voltage, data.current);
  const kw = calculatePower(data.voltage, data.current, data.powerFactor);
  const kvar = calculateKVAR(kva, kw);
  const calculatedPower = kw;
  const loadFactor = calculateLoadFactor(calculatedPower, data.ratedKW);

  return {
    kva: parseFloat(kva.toFixed(2)),
    kw: parseFloat(kw.toFixed(2)),
    kvar: parseFloat(kvar.toFixed(2)),
    calculatedPower: parseFloat(calculatedPower.toFixed(2)),
    loadFactor: parseFloat(loadFactor.toFixed(4)),
  };
}
