export interface Sticker {
  fileName: string,
  coverFileName: string,
  jobName: string,
  className: string,
  jobIndex: number,
  fileIndex: number,
}

export interface Job {
  name: string,
  class: string,
  baseNames: string[]
}

export interface TreeNode {
  value: string;
  title: string;
  children?: TreeNode[];
}

export interface OptionGroup {
  label: string;
  title: string;
  options: Option[];
}

export interface Option {
  label: string;
  value: string;
}