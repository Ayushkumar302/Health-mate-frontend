export const formatDate = (date , config) =>{
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
    const options = config ? config : defaultOptions
    return new Date(date).toLocaleDateString('en-US' , options)

}