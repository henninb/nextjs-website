import { ImageFormatType } from "./ImageFormatType";

export default interface ReceiptImage {
  receiptImageId: number;
  owner?: string;
  transactionId: number;
  activeStatus: boolean;
  imageFormatType: ImageFormatType;
  image: string;
  thumbnail: string;
}
