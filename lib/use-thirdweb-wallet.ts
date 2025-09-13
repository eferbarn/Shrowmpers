// Changed the login method to login with email
"use client"

import { useActiveAccount, useConnect, useDisconnect, useActiveWallet } from "thirdweb/react"
import { inAppWallet, preAuthenticate } from "thirdweb/wallets/in-app"
import { client } from "./thirdweb-config"
import { useState, useEffect } from "react"
import { createClient } from "./supabase/client"

export function useThirdwebWallet() {
  const account = useActiveAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const wallet = useActiveWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [currentEmail, setCurrentEmail] = useState("")

  useEffect(() => {
    const savedSession = localStorage.getItem("thirdweb_session")
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        const now = Date.now()

        // Check if session is still valid (24 hours)
        if (sessionData.expiresAt > now) {
          setCurrentEmail(sessionData.email)
        } else {
          // Session expired, clear it
          localStorage.removeItem("thirdweb_session")
        }
      } catch (error) {
        localStorage.removeItem("thirdweb_session")
      }
    }
  }, [account])

  useEffect(() => {
    const saveUserToDatabase = async () => {
      if (account && currentEmail) {
        try {
          const supabase = createClient()
          const normalizedAddress = account.address.toLowerCase()

          // First check if user exists by email
          const { data: existingUser, error: selectError } = await supabase
            .from("user_scores")
            .select("id, email, wallet_address")
            .eq("email", currentEmail)
            .single()

          if (selectError && selectError.code !== "PGRST116") {
            // PGRST116 is "not found" error, which is expected for new users
            console.error("Error checking existing user:", selectError)
            return
          }

          if (existingUser) {
            // Update existing user's wallet address
            const { error: updateError } = await supabase
              .from("user_scores")
              .update({
                wallet_address: normalizedAddress,
                updated_at: new Date().toISOString(),
              })
              .eq("email", currentEmail)

            if (updateError) {
              console.error("Failed to update user in database:", updateError)
            }
          } else {
            // Insert new user
            const { error: insertError } = await supabase.from("user_scores").insert({
              email: currentEmail,
              wallet_address: normalizedAddress,
              score: 0,
              daily_clicks: 0,
              base_power: 1,
              is_holder: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (insertError) {
              console.error("Failed to insert user to database:", insertError)
            }
          }

          const sessionData = {
            email: currentEmail,
            walletAddress: normalizedAddress,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          }
          localStorage.setItem("thirdweb_session", JSON.stringify(sessionData))
        } catch (error) {
          console.error("Error saving user data:", error)
        }
      }
    }

    saveUserToDatabase()
  }, [account, currentEmail])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const sendVerificationEmail = async (email: string) => {
    try {
      if (!validateEmail(email)) {
        throw new Error("Please enter a valid email address")
      }

      setIsConnecting(true)

      await preAuthenticate({
        client,
        strategy: "email",
        email,
      })

      setCurrentEmail(email)
      setEmailSent(true)
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429) {
        throw new Error("Too many requests. Please wait a moment before trying again.")
      }
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const verifyAndConnect = async (verificationCode: string) => {
    try {
      setIsConnecting(true)

      await connect(async () => {
        const wallet = inAppWallet()

        await wallet.connect({
          client,
          strategy: "email",
          email: currentEmail,
          verificationCode,
        })

        return wallet
      })

      setEmailSent(false)
    } catch (error) {
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (wallet) {
        await disconnect(wallet)
      }

      localStorage.removeItem("thirdweb_session")
      setEmailSent(false)
      setCurrentEmail("")
    } catch (error) {
      localStorage.removeItem("thirdweb_session")
      setEmailSent(false)
      setCurrentEmail("")
    }
  }

  return {
    address: account?.address || null,
    isConnected: !!account,
    isConnecting,
    emailSent,
    currentEmail,
    sendVerificationEmail,
    verifyAndConnect,
    disconnect: disconnectWallet,
    setCurrentEmail,
  }
}
