import { useState } from "react"

import Button from "../components/Button"
import Input from "../components/Input"
import Card from "../components/Card"
import Modal from "../components/modal"
import Loader from "../components/Loader"
import Toast from "../components/toast"
import Badge from "../components/Badge"

function DesignSystem() {

  const [name, setName] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-secondary-100 p-8">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-bold text-secondary-700">
          AI HR Recruitment UI Kit
        </h1>

        <p className="mt-2 text-secondary-500">
          Shared frontend components for the project.
        </p>

        {/* Buttons */}

        <Card className="mt-8">

          <h2 className="text-xl font-bold">
            Buttons
          </h2>

          <div className="mt-4 flex gap-4">

            <Button>
              Primary Button
            </Button>

            <Button variant="secondary">
              Secondary Button
            </Button>

          </div>

        </Card>

        {/* Input */}

        <Card className="mt-6">

          <h2 className="text-xl font-bold">
            Input
          </h2>

          <div className="mt-4 max-w-md">

            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

          </div>

        </Card>

        {/* Badge */}

        <Card className="mt-6">

          <h2 className="text-xl font-bold">
            Badges
          </h2>

          <div className="mt-4 flex gap-3">

            <Badge variant="blue">
              Screening
            </Badge>

            <Badge variant="green">
              Selected
            </Badge>

            <Badge variant="yellow">
              Pending
            </Badge>

            <Badge variant="red">
              Rejected
            </Badge>

          </div>

        </Card>

        {/* Loader */}

        <Card className="mt-6">

          <h2 className="text-xl font-bold">
            Loader
          </h2>

          <Loader />

        </Card>

        {/* Modal */}

        <Card className="mt-6">

          <h2 className="text-xl font-bold">
            Modal
          </h2>

          <div className="mt-4">

            <Button onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>

          </div>

        </Card>

        {/* Toast */}

        <Card className="mt-6">

          <h2 className="text-xl font-bold">
            Toast
          </h2>

          <div className="mt-4">

            <Button onClick={() => setShowToast(true)}>
              Show Toast
            </Button>

          </div>

        </Card>

      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
      >
        <p className="text-secondary-500">
          This is the shared modal component.
        </p>
      </Modal>

      {showToast && (
        <Toast
          message="This is a notification"
          type="success"
        />
      )}

    </div>
  )
}

export default DesignSystem