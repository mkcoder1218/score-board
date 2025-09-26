"use client"

import { useState, useEffect } from "react"
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  doc,
  getDoc,
  getDocs,
  Query,
  DocumentData,
  Firestore,
  CollectionReference,
} from "firebase/firestore"
import { useFirestore } from "@/firebase/provider"

export const useCollection = <T,>(q: Query<DocumentData> | null) => {
  const [data, setData] = useState<T[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (q === null) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: T[] = []
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as any)
        })
        setData(data)
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
  }, [q])

  return { data, error, loading }
}
