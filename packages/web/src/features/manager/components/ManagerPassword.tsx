import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Input from "@razzia/web/components/Input"
import { type KeyboardEvent, useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  onSubmit: (_password: string) => void
  disabled?: boolean
}

const ManagerPassword = ({ onSubmit, disabled }: Props) => {
  const [password, setPassword] = useState("")
  const { t } = useTranslation()

  const handleSubmit = () => {
    if (disabled) {
      return
    }

    onSubmit(password)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <Card>
      <Input
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("manager:passwordPlaceholder")}
      />
      <Button className="mt-4" onClick={handleSubmit}>
        {t("common:submit")}
      </Button>
    </Card>
  )
}

export default ManagerPassword
