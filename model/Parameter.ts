export default interface Parameter {
  parameterId: number;
  owner?: string;
  parameterName: string;
  parameterValue: string;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
