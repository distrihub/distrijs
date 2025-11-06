import { DistriFnTool } from '@distri/core';
import { ProjectFilesystem } from '../storage/indexedDbFilesystem';
import type { FilesystemToolsOptions } from '../types';
export declare const createFilesystemTools: (projectId: string, options?: FilesystemToolsOptions & {
    filesystem?: ProjectFilesystem;
}) => DistriFnTool[];
//# sourceMappingURL=fileTools.d.ts.map