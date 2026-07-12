export type ValidationFieldError = {
  path: string;
  message: string;
};

export type ValidationErrorDto = {
  code: "VALIDATION_ERROR";
  fields: ValidationFieldError[];
};
