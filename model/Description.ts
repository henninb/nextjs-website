export default interface Description {
  descriptionId: number;
  owner?: string;
  descriptionName: string;
  activeStatus: boolean;
  descriptionCount?: number;
  dateAdded?: Date;
  dateUpdated?: Date;
}
