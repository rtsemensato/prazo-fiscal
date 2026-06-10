export interface StandardResponseBase {
  success: boolean;
  message?: string;
}

export interface StandardResponseGetList<T> extends StandardResponseBase {
  data: T[];
}

export interface StandardResponseGetUnique<T> extends StandardResponseBase {
  data: T;
}

export interface StandardResponseCreate<T> extends StandardResponseBase {
  data: T;
}

export interface StandardResponseEdit<T> extends StandardResponseBase {
  data: T;
}

export interface StandardResponseDelete extends StandardResponseBase {
  data: null;
}
