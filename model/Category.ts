export default interface Category {
  categoryId: number;
  owner?: string;
  categoryName: string;
  activeStatus: boolean;
  categoryCount?: number;
  dateAdded?: Date;
  dateUpdated?: Date;
}
