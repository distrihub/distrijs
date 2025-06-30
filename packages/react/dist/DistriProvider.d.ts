import React, { ReactNode } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
interface DistriContextValue {
    client: DistriClient | null;
    error: Error | null;
    isLoading: boolean;
}
interface DistriProviderProps {
    config: DistriClientConfig;
    children: ReactNode;
}
export declare function DistriProvider({ config, children }: DistriProviderProps): React.JSX.Element;
export declare function useDistri(): DistriContextValue;
export declare function useDistriClient(): DistriClient;
export {};
