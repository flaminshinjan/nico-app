declare module "html-to-docx" {
  function HTMLtoDOCX(
    html: string,
    header: string | null,
    options: object
  ): Promise<Buffer | Blob>;
  export default HTMLtoDOCX;
}
