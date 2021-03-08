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

type TUrlRes = string

export default class UrlLoader extends LoaderBase<IUrlLoadEvents> implements ILoader<TUrlRes>{

  private sessionKey = `${RESLOADER_NAMESPACE}:urlLoader`

  constructor(){
    super()
  }
  
  async load(resUrl: TUrlRes) {
    const cacheKey = `${this.sessionKey}:${resUrl}`
    const cachedItem = getItem(cacheKey)
    if (cachedItem) return cachedItem
    const res = await fetch(resUrl)
    const text = await res.text()
    setItem(cacheKey, text)
    return text
  }
}
