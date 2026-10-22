import { createContext, useContext } from 'react';
import { Packet } from '../types';

export interface Telemetry {
  packets: Packet[];
  packetRate: number;
  rateHistory: number[];
  isCapturing: boolean;
  isConnected: boolean;
  threatCount: number;
  /** A malicious packet arrived within the last few seconds */
  threatActive: boolean;
}

export const TelemetryContext = createContext<Telemetry>({
  packets: [],
  packetRate: 0,
  rateHistory: [],
  isCapturing: false,
  isConnected: false,
  threatCount: 0,
  threatActive: false,
});

export const useTelemetry = () => useContext(TelemetryContext);
