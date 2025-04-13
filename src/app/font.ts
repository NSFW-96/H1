import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Use Inter from Google Fonts as fallback
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Use local Inter font files
export const interLocal = localFont({
  src: [
    {
      path: '../fonts/Inter-Thin-BETA.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-ThinItalic-BETA.otf',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-ExtraLight-BETA.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-ExtraLightItalic-BETA.otf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-Light-BETA.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-LightItalic-BETA.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-SemiBoldItalic.otf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-ExtraBold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-ExtraBoldItalic.otf',
      weight: '800',
      style: 'italic',
    },
    {
      path: '../fonts/Inter-Black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-BlackItalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-inter-local',
}); 