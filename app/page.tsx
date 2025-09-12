import type { Metadata } from "next"
import { Sixtyfour } from "next/font/google"
import GameComponent from "@/components/GameComponent"

const sixtyfour = Sixtyfour({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shrowmpers",
  description: "Anoma Tap-to-Earn",
  openGraph: {
    title: "Shrowmpers",
    description: "Anoma Tap-to-Earn",
    images: [
      {
        url: "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=250&w=250",
        width: 1200,
        height: 630,
        alt: "Shrowmpers - Anoma Tap-to-Earn",
      },
    ],
  },
}

export default function Home() {
  return (
    <main className={`${sixtyfour.className} min-h-screen bg-gradient-to-br from-red-500 via-rose-400 to-pink-500`}>
      <GameComponent />
    </main>
  )
}
