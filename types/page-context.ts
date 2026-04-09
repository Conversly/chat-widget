export interface PageLink {
  text: string;
  href: string;
}

export interface PageFormField {
  label: string;
  type: string;
  name: string;
}

export interface PageContext {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  links: PageLink[];
  buttons: string[];
  formFields: PageFormField[];
  selectedText: string;
  bodyText: string;
  contentHash: string;
}
