
import React, { createContext, useContext, useState, ReactNode } from 'react';

const INITIAL_AVATARS: string[] = [
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_mickeymouse_2c5b3693.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_minniemouse_3d65e238.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_donaldduck_027s981a.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_goofy_6a1b659b.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_elsa_19330a6e.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_woody_5302663a.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_buzzlightyear_a25b2931.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_sulley_8f6b7a59.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_nemo_567d3419.png',
    'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_lightningmcqueen_d5109b55.png',
    'https://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55/standard_xlarge.jpg',
    'https://i.annihil.us/u/prod/marvel/i/mg/3/50/537ba56d31087/standard_xlarge.jpg',
    'https://i.annihil.us/u/prod/marvel/i/mg/6/a0/55b6a25e654e6/standard_xlarge.jpg',
    'https://i.annihil.us/u/prod/marvel/i/mg/5/a0/538615ca33ab0/standard_xlarge.jpg',
    'https://i.annihil.us/u/prod/marvel/i/mg/c/e0/537f26900698c/standard_xlarge.jpg'
];

interface AvatarsContextType {
  avatars: string[];
  addAvatar: (avatarUrl: string) => void;
  deleteAvatar: (avatarUrl: string) => void;
}

const AvatarsContext = createContext<AvatarsContextType | undefined>(undefined);

export const AvatarsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [avatars, setAvatars] = useState<string[]>(INITIAL_AVATARS);

  const addAvatar = (avatarUrl: string) => {
    if (avatarUrl && !avatars.includes(avatarUrl)) {
        setAvatars(prev => [avatarUrl, ...prev]);
    }
  };

  const deleteAvatar = (avatarUrl: string) => {
    setAvatars(prev => prev.filter(url => url !== avatarUrl));
  };
  
  return (
    <AvatarsContext.Provider value={{ avatars, addAvatar, deleteAvatar }}>
      {children}
    </AvatarsContext.Provider>
  );
};

export const useAvatars = () => {
  const context = useContext(AvatarsContext);
  if (context === undefined) {
    throw new Error('useAvatars must be used within a AvatarsProvider');
  }
  return context;
};
