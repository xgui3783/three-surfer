import { LoaderBase, ILoader } from './LoaderBase'
import { RESLOADER_NAMESPACE } from './constants'
import { setItem, getItem } from './cache'

interface IUrlLoadEvents {
  error: IUrlLoaderError
  done: IUrlLoaderDone
}

interface IUrlLoaderError {
  error: string
}

interface IUrlLoaderDone {
  data: string
}

export async function fetchStr(url: string): Promise<string>{
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(await resp.text() || resp.statusText || resp.status.toString())
  }
  return await resp.text()
}

export async function fetchRaw(url: string): Promise<ArrayBuffer> {
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(await resp.text() || resp.statusText || resp.status.toString())
  }
  return await resp.arrayBuffer()
}
