export default interface Category {
  categoryId: number;
  categoryName: string;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
