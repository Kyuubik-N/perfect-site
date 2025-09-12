import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'

export default function LogoutButton() {
  const { logout } = useAuth()
  return <Button onClick={logout}>Выйти</Button>
}
