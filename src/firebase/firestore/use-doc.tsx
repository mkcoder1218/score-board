"use client"

import { useState, useEffect } from "react"
import {
  onSnapshot,
  doc,
  DocumentReference,
  DocumentData,
} from "firebase/firestore"

export const useDoc = <T,>(ref: DocumentReference<DocumentData> | null) => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ref === null) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as any)
        } else {
          setData(null)
        }
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        console.error(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [ref])

  return { data, error, loading }
}
