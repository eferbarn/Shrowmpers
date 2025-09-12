"use client"

import type React from "react"
import { getScore, upgradeLevel, getUpgradeCost } from "@/lib/supabase" // Import getScore function
import { getUserData, updateScoreWithHolder, checkNFTHolder, updateDailyClicks } from "@/lib/supabase"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import { useWallet } from "@/lib/use-wallet"
import { Home, Twitter, CheckSquare, AlertTriangle, Copy, LogOut, Star } from "lucide-react"
import { formatNumber } from "@/lib/utils" // Import number formatting function
import debounce from "lodash/debounce"

const AnalogCounter = ({ value }: { value: number }) => {
  return (
    <motion.div
      className="flex bg-red-600/30 rounded-lg px-4 py-2 border border-red-400/40"
      initial={false}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-2xl font-bold text-white tabular-nums">{formatNumber(value)}</span>
    </motion.div>
  )
}

export default function GameComponent() {
  const [shrimpClicks, setShrimpClicks] = useState<{ x: number; y: number; id: number }[]>([])
  const [shrimpCount, setShrimpCount] = useState(0)
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet()
  const [clickId, setClickId] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMetaMaskMessage, setShowMetaMaskMessage] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [initialScore, setInitialScore] = useState<number | null>(null)
  const [isScoreLoaded, setIsScoreLoaded] = useState(false)
  const [isHolder, setIsHolder] = useState(false)
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
  const [showHolderTooltip, setShowHolderTooltip] = useState(false)
  const [isCheckingNFT, setIsCheckingNFT] = useState(false)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [randomTokenId, setRandomTokenId] = useState<number | null>(null) // Added state for random token ID for non-holders
  const [remainingClicks, setRemainingClicks] = useState(1000)
  const [totalClicks, setTotalClicks] = useState(0)
  const [showPowerPopup, setShowPowerPopup] = useState(false) // Added power popup state
  const [basePower, setBasePower] = useState(1) // Added basePower state
  const [clickTimes, setClickTimes] = useState<number[]>([]) // Keep for UI feedback but not security
  const [showCooldownPopup, setShowCooldownPopup] = useState(false)
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0)
  const [isInCooldown, setIsInCooldown] = useState(false) // Add server-side cooldown state

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { damping: 15, stiffness: 200 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)
  const rotateX = useTransform(ySpring, [-100, 100], [15, -15])
  const rotateY = useTransform(xSpring, [-100, 100], [-15, 15])

  useEffect(() => {
    const audio = new Audio(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snip-BlPoeCPNqEBvxZDLmbjTgHHCxjcTQu.mp3",
    )
    audio.preload = "auto"
    audioRef.current = audio

    const initAudio = () => {
      audio
        .play()
        .then(() => {
          audio.pause()
          audio.currentTime = 0
        })
        .catch((error) => console.warn("Error initializing audio:", error))
    }

    document.addEventListener("click", initAudio, { once: true })

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      document.removeEventListener("click", initAudio)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    document.body.addEventListener("touchmove", preventDefault, { passive: false })
    return () => {
      document.body.removeEventListener("touchmove", preventDefault)
    }
  }, [])

  useEffect(() => {
    if (showMetaMaskMessage) {
      const timer = setTimeout(() => {
        setShowMetaMaskMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showMetaMaskMessage])

  useEffect(() => {
    const fetchUserData = async () => {
      if (isConnected && address) {
        try {
          setIsCheckingNFT(true)

          const userData = await getUserData(address)
          setShrimpCount(userData.score)
          setIsHolder(userData.isHolder)
          setNftImageUrl(userData.nftImageUrl)
          setRemainingClicks(userData.remainingClicks)
          setTotalClicks(userData.totalClicks)
          setBasePower(userData.basePower)

          const holderData = await checkNFTHolder(address)
          if (holderData.isHolder !== userData.isHolder || holderData.nftImageUrl !== userData.nftImageUrl) {
            setIsHolder(holderData.isHolder)
            setNftImageUrl(holderData.nftImageUrl)
            setTokenId(holderData.tokenId)
            await updateScoreWithHolder(address, userData.score, holderData.isHolder, holderData.nftImageUrl)
          } else {
            setTokenId(holderData.tokenId)
          }

          if (!holderData.isHolder) {
            const randomId = Math.floor(Math.random() * 3000) + 1
            setRandomTokenId(randomId)
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error)
          setErrorMessage(`Failed to fetch user data. Starting from 0.`)
          setTimeout(() => setErrorMessage(null), 5000)
        } finally {
          setIsCheckingNFT(false)
        }
      }
    }

    fetchUserData()
  }, [isConnected, address])

  useEffect(() => {
    const fetchInitialScore = async () => {
      if (isConnected && address && !isScoreLoaded) {
        try {
          const score = await getScore(address)
          setInitialScore(score)
          setShrimpCount(score)
          setIsScoreLoaded(true)
        } catch (error) {
          console.error("Error fetching initial score:", error)
          setErrorMessage("Failed to fetch initial score. Starting from 0.")
          setTimeout(() => setErrorMessage(null), 5000)
        }
      }
    }

    fetchInitialScore()
  }, [isConnected, address, isScoreLoaded])

  const debouncedUpdateScore = useRef(
    debounce(async (address: string, score: number, isHolder: boolean, nftImageUrl: string | null) => {
      try {
        await updateScoreWithHolder(address, score, isHolder, nftImageUrl)
      } catch (error) {
        console.error("Error updating score:", error)
        setErrorMessage("Failed to update score. Please try again.")
        setTimeout(() => setErrorMessage(null), 5000)
      }
    }, 1000),
  ).current

  useEffect(() => {
    if (isConnected && address && isScoreLoaded && shrimpCount !== initialScore) {
      debouncedUpdateScore(address, shrimpCount, isHolder, nftImageUrl)
    }
  }, [isConnected, address, isScoreLoaded, shrimpCount, initialScore, isHolder, nftImageUrl])

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => console.warn("Error playing sound:", error))
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(event.clientX - centerX)
    y.set(event.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isConnected) {
      if (!isConnecting) {
        if (window.ethereum) {
          connect()
        } else {
          setShowMetaMaskMessage(true)
        }
      }
      return
    }

    const now = Date.now()
    const recentClicks = clickTimes.filter((time) => now - time < 1000)

    if (recentClicks.length >= 10) {
      setShowCooldownPopup(true)
      setCooldownTimeLeft(2)
      setIsInCooldown(true)

      // Start countdown
      const countdown = setInterval(() => {
        setCooldownTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            setShowCooldownPopup(false)
            setIsInCooldown(false)
            setClickTimes([]) // Reset click times after cooldown
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return
    }

    // Update click times for rate limiting
    setClickTimes((prev) => [...prev.filter((time) => now - time < 1000), now])

    // Check if user has remaining clicks
    if (remainingClicks <= 0) {
      setErrorMessage("Daily click limit reached! Resets at midnight UTC.")
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (!event.currentTarget) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setClickId((prev) => prev + 1)
    setShrimpClicks((prev) => [...prev, { x, y, id: clickId }])

    const scoreIncrement = isHolder ? basePower * 2 : basePower

    // Update local state immediately for better UX
    setShrimpCount((prev) => prev + scoreIncrement)
    setRemainingClicks((prev) => prev - 1)
    setTotalClicks((prev) => prev + 1)

    // Update database
    try {
      const result = await updateDailyClicks(address!, basePower, isHolder)
      if (!result.success) {
        // Revert local changes if database update failed
        setShrimpCount((prev) => prev - scoreIncrement)
        setRemainingClicks((prev) => prev + 1)
        setTotalClicks((prev) => prev - 1)
        setErrorMessage("Daily click limit reached!")
        setTimeout(() => setErrorMessage(null), 3000)
        return
      }
      setRemainingClicks(result.remainingClicks)
    } catch (error) {
      console.error("Error updating daily clicks:", error)
      // Revert local changes on error
      setShrimpCount((prev) => prev - scoreIncrement)
      setRemainingClicks((prev) => prev + 1)
      setTotalClicks((prev) => prev - 1)
    }

    playSound()
  }

  const handleWalletClick = async () => {
    if (isConnected) {
      setShowWalletOptions(true)
    } else {
      if (window.ethereum) {
        console.log("Connecting wallet")
        await connect()
      } else {
        setShowMetaMaskMessage(true)
      }
    }
  }

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setShowWalletOptions(false)
    }
  }

  const handleDisconnect = () => {
    console.log("Disconnecting wallet")
    disconnect()
    setShowWalletOptions(false)
    setShrimpCount(0)
    setInitialScore(null)
    setIsScoreLoaded(false)
    setIsHolder(false)
    setNftImageUrl(null)
    setTokenId(null)
    setRandomTokenId(null) // Reset random token ID on disconnect
    setRemainingClicks(1000)
    setTotalClicks(0)
    setBasePower(1) // Reset base power on disconnect
  }

  const handleUpgrade = async () => {
    if (!isConnected || !address) return

    try {
      const result = await upgradeLevel(address)
      if (result.success) {
        setBasePower(result.newLevel)
        setShrimpCount(result.newScore)
        setErrorMessage(`Upgraded to Level ${result.newLevel}!`)
        setTimeout(() => setErrorMessage(null), 3000)
      } else {
        const cost = await getUpgradeCost(basePower)
        setErrorMessage(`Need ${formatNumber(cost)} points to upgrade!`)
        setTimeout(() => setErrorMessage(null), 3000)
      }
    } catch (error) {
      console.error("Error upgrading:", error)
      setErrorMessage("Upgrade failed. Please try again.")
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Shrowmpers is loading
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  ...
                </motion.span>
              </h2>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="text-5xl text-white font-bold"
              >
                🦐
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-md shadow-md"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_50%)]" />
        <div className="grid grid-cols-12 gap-4 p-4 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="bg-white/10 rounded-full w-full h-full transform rotate-45" />
          ))}
        </div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-start p-4 pt-2 sm:pt-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <a
            href="https://x.com/eferbarn"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-8 h-8 hover:scale-105 transition-transform"
          >
            <Image
              src="https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=512&w=512"
              alt="Shrimpers Logo"
              width={32}
              height={32}
              className="object-cover rounded-full border border-red-400/40"
              priority
            />
          </a>
          <h1 className="text-sm font-bold text-white">Shrowmpers</h1>
        </div>

        <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md mx-auto border border-red-300/30">
          <div className="flex flex-col items-center"></div>

          <div className="text-xs font-bold text-center mb-4 text-white flex items-center justify-center gap-2">
            <span>Shrowmps:</span>
            <motion.div
              className="flex bg-red-600/30 rounded-lg px-2 py-1 border border-red-400/40"
              initial={false}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-sm font-bold text-white tabular-nums">{formatNumber(shrimpCount)}</span>
            </motion.div>
          </div>

          <motion.div
            className="relative w-full aspect-square max-w-[300px] mx-auto bg-red-500/10 rounded-xl overflow-hidden cursor-pointer border border-red-300/40 mb-4 perspective-1000"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isCheckingNFT && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm z-10">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="text-4xl mb-2"
                  >
                    🦐
                  </motion.div>
                  <p className="text-white text-sm">Checking NFTs...</p>
                </div>
              </div>
            )}

            <Image
              src={
                isHolder
                  ? nftImageUrl ||
                    "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=512&w=512"
                  : randomTokenId
                    ? `https://ipfs.io/ipfs/QmW5mWeEQfsDmwUBiYhLaGjc3h6kGWMYdSwwrEovpqiEZX/${randomTokenId}/`
                    : "https://i2.seadn.io/collection/shrimpers-nft-69/image_type_logo/775458abb36f9b838f285473f91108/07775458abb36f9b838f285473f91108.jpeg?h=512&w=512"
              }
              alt="Shrimpers NFT"
              layout="fill"
              objectFit="cover"
              className={`transform transition-transform ${showMetaMaskMessage ? "blur-sm" : ""}`}
              priority
            />

            {isHolder && (
              <div
                className="absolute top-2 right-2 bg-red-500 rounded-full p-2 cursor-pointer shadow-lg"
                onMouseEnter={() => setShowHolderTooltip(true)}
                onMouseLeave={() => setShowHolderTooltip(false)}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {showHolderTooltip && (
                  <div className="absolute top-full right-0 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Shrimpers Holder
                  </div>
                )}
              </div>
            )}

            {(isHolder && tokenId) || (!isHolder && randomTokenId) ? (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-1">
                  <p className="text-white text-center text-sm font-sans">
                    #{isHolder ? tokenId : randomTokenId}
                    {!isHolder && <span className="text-white/70"> (Rand. Art)</span>}
                  </p>
                </div>
              </div>
            ) : null}

            <AnimatePresence>
              {shrimpClicks.map(({ x, y, id }) => (
                <motion.div
                  key={id}
                  className="absolute w-20 h-20 text-4xl pointer-events-none"
                  style={{ left: x - 40, top: y - 40 }}
                  initial={{ opacity: 1, scale: 0, y: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    scale: [0, 1, 1],
                    y: -100,
                  }}
                  transition={{
                    duration: 1,
                    times: [0, 0.3, 1],
                  }}
                  onAnimationComplete={() => {
                    setShrimpClicks((clicks) => clicks.filter((click) => click.id !== id))
                  }}
                >
                  🦐
                </motion.div>
              ))}
            </AnimatePresence>

            {showMetaMaskMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white p-4 text-center"
              >
                <div>
                  <AlertTriangle className="mx-auto mb-2" size={32} />
                  <p className="font-bold">Please install an EVM wallet provider to use this app</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="mb-4">
            <div className="relative w-full h-2 bg-red-900/40 rounded-full overflow-visible">
              <div
                className="absolute top-0 right-0 h-full bg-red-500/60 transition-all duration-300"
                style={{ width: `${((1000 - remainingClicks) / 1000) * 100}%` }}
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 text-lg transition-all duration-300 z-10"
                style={{
                  left: `${(remainingClicks / 1000) * 100}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                }}
              >
                <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-red-400 shadow-lg">
                  <span className="text-sm">🦐</span>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-white/70 mt-1">{remainingClicks} clicks remaining today</div>
          </div>

          <div className="relative mb-4">
            <button
              onClick={handleWalletClick}
              disabled={isConnecting}
              className="w-full bg-red-600/40 text-white text-sm rounded-xl py-3 hover:bg-red-600/60 transition-all border border-red-400/40 backdrop-blur-md shadow-lg shadow-red-500/20 flex items-center justify-center"
            >
              {isConnecting ? (
                "Connecting..."
              ) : isConnected ? (
                <>
                  <span className="mr-2">🎒</span>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
            <AnimatePresence>
              {showWalletOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-red-600/80 backdrop-blur-md rounded-lg shadow-lg p-2 z-10"
                >
                  <button
                    onClick={copyToClipboard}
                    className="w-full text-left px-4 py-2 text-white hover:bg-red-500/50 rounded transition-colors flex items-center"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Address
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="w-full text-left px-4 py-2 text-white hover:bg-red-500/50 rounded transition-colors flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Disconnect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-red-600/40 backdrop-blur-lg border border-red-400/40 rounded-xl sticky bottom-4 left-0 right-0 mx-4">
            <div className="px-4 py-2 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveTab("home")
                  setShowPowerPopup(true)
                }}
                className="flex flex-col items-center p-2 transition-colors relative flex-1"
              >
                <div
                  className={`absolute inset-0 ${activeTab === "home" ? "bg-red-500/60" : "bg-transparent"} rounded-lg transition-colors duration-200`}
                />
                <Home size={20} className="relative z-10 text-white" />
                <span className={`text-xs mt-1 relative z-10 ${activeTab === "home" ? "text-white" : "text-white/90"}`}>
                  Home
                </span>
              </button>
              <a
                href="https://x.com/eferbarn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveTab("twitter")}
                className="flex flex-col items-center p-2 transition-colors relative flex-1"
              >
                <div
                  className={`absolute inset-0 ${activeTab === "twitter" ? "bg-red-500/60" : "bg-transparent"} rounded-lg transition-colors duration-200`}
                />
                <Twitter size={20} className="relative z-10 text-white" />
                <span
                  className={`text-xs mt-1 relative z-10 ${activeTab === "twitter" ? "text-white" : "text-white/90"}`}
                >
                  Eferbarn
                </span>
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab("task")
                }}
                className="flex flex-col items-center p-2 transition-colors relative flex-1 group"
              >
                <div
                  className={`absolute inset-0 ${activeTab === "task" ? "bg-red-500/60" : "bg-transparent"} rounded-lg transition-colors duration-200`}
                />
                <CheckSquare size={20} className="relative z-10 text-white" />
                <span className={`text-xs mt-1 relative z-10 ${activeTab === "task" ? "text-white" : "text-white/90"}`}>
                  Task
                </span>
                <div className="absolute bottom-full mb-2 p-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Coming Soon
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCooldownPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-red-500/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-red-300/30 text-center"
            >
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-white mb-2">Slow Down!</h3>
              <p className="text-white/80 mb-4">Too many clicks! Please rest for {cooldownTimeLeft} seconds.</p>
              <div className="text-2xl font-bold text-yellow-400">{cooldownTimeLeft}s</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPowerPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setShowPowerPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-red-500/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-red-300/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-4">⚡ Upgrade</h2>
                </div>

                <div className="bg-red-600/30 rounded-lg p-4 mb-4 border border-red-400/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Current Level:</span>
                    <span className="text-yellow-400 font-bold text-sm">{basePower}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-xs">Points per click:</span>
                    <span className="text-white font-bold text-xs">
                      {basePower}
                      {isHolder && <span className="text-yellow-400"> x2</span>} ={" "}
                      {isHolder ? basePower * 2 : basePower}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="bg-red-600/20 rounded-lg p-3 border border-red-400/30">
                    <div className="flex items-center justify-between">
                      <div className="text-left flex-1">
                        <div className="text-white font-semibold text-sm">Level {basePower + 1}</div>
                        <div className="text-xs text-white/70">Cost: {formatNumber(Math.pow(10, basePower))}</div>
                        <div className="text-xs text-white/70">Next: {basePower + 1}/click</div>
                      </div>
                      <button
                        onClick={handleUpgrade}
                        disabled={shrimpCount < Math.pow(10, basePower)}
                        className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors ml-2 ${
                          shrimpCount >= Math.pow(10, basePower)
                            ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {shrimpCount >= Math.pow(10, basePower) ? "Upgrade" : "Need more"}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPowerPopup(false)}
                  className="w-full bg-red-600/40 text-white rounded-xl py-3 hover:bg-red-600/60 transition-all border border-red-400/40"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
