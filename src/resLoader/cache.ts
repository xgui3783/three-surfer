// for now, only implement session storage
// in the future, change the cache as needed

export const getItem = (key: string) => {
  return sessionStorage.getItem(key)
}

export const setItem = (key: string, value: string) => {
  sessionStorage.setItem(key, value)
}

export const removeItem = (key: string) => {
  sessionStorage.removeItem(key)
}
