export default interface Parameter {
  parameterId: number;
  parameterName: string;
  parameterValue: string;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
