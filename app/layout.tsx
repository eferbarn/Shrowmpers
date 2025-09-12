import type React from "react"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shrowmpers",
  description: "Anoma Tap-to-Earn",
  generator: "eferbarn",
  icons: {
    icon: [
      {
        url: "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
        type: "image/jpeg",
        sizes: "32x32",
      },
      {
        url: "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
        type: "image/jpeg",
        sizes: "16x16",
      },
    ],
    apple: {
      url: "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
      type: "image/jpeg",
      sizes: "180x180",
    },
  },
  openGraph: {
    title: "Shrowmpers",
    description: "Anoma Tap-to-Earn",
    images: [
      {
        url: "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
        width: 250,
        height: 250,
        alt: "Shrimpers Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shrowmpers",
    description: "Anoma Tap-to-Earn",
    images: [
      "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
    ],
    creator: "@themeowshi",
  },
  other: {
    // Farcaster Frame Meta Tags
    "fc:frame": "vNext",
    "fc:frame:image":
      "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
    "fc:frame:button:1": "Play Shrowmpers",
    "fc:frame:button:1:action": "post_redirect",
    "fc:frame:button:1:target": "https://mewoshi.vercel.app",
    "fc:frame:button:2": "Share",
    "fc:frame:button:2:action": "post",
    "fc:frame:input:text": "Connect your wallet to start earning Shrowmps!",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        {/* Additional Farcaster Frame meta tags that can't be added via Next.js metadata */}
        <meta property="fc:frame" content="vNext" />
        <meta
          property="fc:frame:image"
          content="https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250"
        />
        <meta property="fc:frame:button:1" content="Play Shrowmpers" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content="https://mewoshi.vercel.app" />
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:input:text" content="Connect your wallet to start earning Shrowmps!" />
      </head>
      <body>{children}</body>
    </html>
  )
}
