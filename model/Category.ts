export default interface Category {
  categoryId: number;
  categoryName: string;
  activeStatus: boolean;
  categoryCount?: number;
  dateAdded?: Date;
  dateUpdated?: Date;
}
