export type SearchType = 'mixed' | 'folder' | 'file';

export interface FileItem {
  fid: string;
  pdir_fid: string;
  file_name: string;
  size?: number | string;
  dir?: boolean;
  updated_at?: string | number | Date;
  created_at?: string | number | Date;
}

export interface BreadcrumbItemType {
  fid: string;
  name: string;
}

