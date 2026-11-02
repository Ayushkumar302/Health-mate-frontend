import { useContext, useEffect } from "react"
import { authContext } from "../context/AuthContext.jsx"
import { useLocation, useNavigate } from "react-router-dom"

const ProtectedRoute = ({children , allowedRoles}) => {
    const { token ,role} = useContext(authContext)
    const location = useLocation()
    const navigate = useNavigate()
    const isAllowed = Boolean(token) && allowedRoles.includes(role)

    // redirect once (a <Navigate> element would fire again on every render while the page animates out)
    useEffect(() => {
      // remember the page so login can send the user back to it
      if (!isAllowed) navigate("/login", { replace: true, state: { from: location } })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAllowed])

  return isAllowed ? children : null;
}

export default ProtectedRoute
