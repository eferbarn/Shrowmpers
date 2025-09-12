"use client"

import { useState, useCallback, useEffect } from "react"

declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this app")
      return
    }

    try {
      setIsConnecting(true)
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      setAddress(accounts[0])
      // Store connection state
      localStorage.setItem("wallet_connected", "true")
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    // Clear connection state
    localStorage.removeItem("wallet_connected")
  }, [])

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && localStorage.getItem("wallet_connected") === "true") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })
          if (accounts.length > 0) {
            setAddress(accounts[0])
          }
        } catch (error) {
          console.error("Failed to check connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts[0] || null)
        if (accounts.length === 0) {
          localStorage.removeItem("wallet_connected")
        }
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  return {
    address,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
  }
}
