export interface DefaultBrandPreset {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ChannelPreset {
  type: string;
  title: string;
  defaultBrands: DefaultBrandPreset[];
}
