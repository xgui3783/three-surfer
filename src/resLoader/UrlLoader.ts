import { LoaderBase, ILoader } from './LoaderBase'

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
  constructor(){
    super()
  }
  
  async load(resUrl: TUrlRes) {
    const res = await fetch(resUrl)
    return await res.text()
  }
}
