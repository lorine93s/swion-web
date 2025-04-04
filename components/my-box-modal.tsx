"use client"

import { useState, useRef } from "react"
import type React from "react"
import { X, Plus } from "lucide-react"
import CraftingModal from "./crafting-modal"
import ObjectActionModal from "./object-action-modal"
import { useToast } from "@/hooks/use-toast"

interface MyBoxModalProps {
  onClose: () => void
}

export default function MyBoxModal({ onClose }: MyBoxModalProps) {
  const { toast } = useToast()
  const [objects, setObjects] = useState([
    { id: 101, type: "fish", name: "Pixel Fish", color: "red", projectId: "project1" },
    { id: 102, type: "fish", name: "Dot Fish", color: "blue", projectId: "project1" },
    { id: 103, type: "plant", name: "Seaweed", color: "green", projectId: "project2" },
    { id: 104, type: "decoration", name: "Castle", projectId: "project2" },
    { id: 105, type: "decoration", name: "Treasure", projectId: "project3" },
    { id: 106, type: "synObject", name: "Rainbow Monster", components: [101, 102, 103], image: "🌈" },
  ])

  const [selectedForSynthesis, setSelectedForSynthesis] = useState<any[]>([])
  const [showCraftingModal, setShowCraftingModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "components" | "synObjects">("all")
  const [selectedObject, setSelectedObject] = useState<any | null>(null)

  // For tank drag and drop
  const handleDragStart = (e: React.DragEvent, object: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(object))

    // Create a custom drag image that shows only the object
    const dragImage = document.createElement("div")
    dragImage.className = "w-12 h-12 relative"

    if (object.type === "fish") {
      dragImage.innerHTML = `
        <div class="absolute w-4 h-4" style="left: 0px; top: 2px; background-color: ${object.color}"></div>
        <div class="absolute w-4 h-4" style="left: 4px; top: 0px; background-color: ${object.color}"></div>
        <div class="absolute w-2 h-2 bg-black" style="left: 6px; top: 2px"></div>
      `
    } else if (object.type === "plant") {
      dragImage.innerHTML = `
        <div class="absolute w-2 h-8" style="left: 3px; top: 4px; background-color: ${object.color}"></div>
        <div class="absolute w-2 h-6" style="left: 1px; top: 2px; background-color: ${object.color}"></div>
      `
    } else if (object.type === "decoration") {
      dragImage.innerHTML = `
        <div class="w-10 h-10 bg-yellow-200 border-2 border-black flex items-center justify-center">
          <span class="pixel-text text-xs">${object.name.charAt(0).toUpperCase()}</span>
        </div>
      `
    } else if (object.type === "synObject") {
      dragImage.innerHTML = `
        <div class="w-10 h-10 bg-purple-200 border-2 border-black flex items-center justify-center">
          <span class="text-2xl">${object.image}</span>
        </div>
      `
    }

    document.body.appendChild(dragImage)
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"

    e.dataTransfer.setDragImage(dragImage, 20, 20)

    // Clean up the temporary element after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 100)
  }

  // For synthesis selection
  const toggleObjectSelection = (object: any) => {
    // Only allow ComponentObjects for synthesis, not SynObjects
    if (object.type === "synObject") {
      toast({
        title: "Cannot Select",
        description: "SynObjects cannot be used for synthesis",
        variant: "destructive",
      })
      return
    }

    // Check if already selected
    const isSelected = selectedForSynthesis.some((item) => item.id === object.id)

    if (isSelected) {
      // Remove from selection
      setSelectedForSynthesis(selectedForSynthesis.filter((item) => item.id !== object.id))
    } else {
      // Add to selection if less than 3 items are selected
      if (selectedForSynthesis.length < 3) {
        setSelectedForSynthesis([...selectedForSynthesis, object])
      } else {
        toast({
          title: "Selection Limit",
          description: "You can only select up to 3 objects for synthesis",
          variant: "destructive",
        })
      }
    }
  }

  const startSynthesis = () => {
    if (selectedForSynthesis.length === 0) {
      toast({
        title: "No Objects Selected",
        description: "Please select at least one object for synthesis",
        variant: "destructive",
      })
      return
    }

    setShowCraftingModal(true)
  }

  const handleSynthesisComplete = (result: any) => {
    // Add the new SynObject to the objects list
    const newSynObject = {
      id: Date.now(), // Generate a unique ID
      type: "synObject",
      name: result.name,
      components: selectedForSynthesis.map((obj) => obj.id),
      image: result.image,
      rarity: result.rarity,
      projectId: selectedForSynthesis[0].projectId, // Use the first object's project ID
    }

    // Remove the used ComponentObjects
    const remainingObjects = objects.filter((obj) => !selectedForSynthesis.some((selected) => selected.id === obj.id))

    // Add the new SynObject
    setObjects([...remainingObjects, newSynObject])

    // Clear selection
    setSelectedForSynthesis([])

    // Close the crafting modal
    setShowCraftingModal(false)

    toast({
      title: "Synthesis Complete",
      description: `Created ${result.name}!`,
    })
  }

  // Filter objects based on active tab
  const filteredObjects = objects.filter((obj) => {
    if (activeTab === "all") return true
    if (activeTab === "components") return obj.type !== "synObject"
    if (activeTab === "synObjects") return obj.type === "synObject"
    return true
  })

  const [draggedObject, setDraggedObject] = useState<any | null>(null)
  const [dropTargetObject, setDropTargetObject] = useState<any | null>(null)

  // Track which card is being dragged
  const draggedCardRef = useRef<HTMLDivElement | null>(null)

  const handleDragOver = (e: React.DragEvent, object: any) => {
    e.preventDefault()

    // Don't allow dropping on the same card that's being dragged
    if (draggedCardRef.current === e.currentTarget) {
      return
    }

    // Highlight the drop target
    e.currentTarget.classList.add("border-yellow-400", "border-4")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove highlight
    e.currentTarget.classList.remove("border-yellow-400", "border-4")
  }

  const handleDrop = (e: React.DragEvent, targetObject: any) => {
    e.preventDefault()

    // Remove highlight
    e.currentTarget.classList.remove("border-yellow-400", "border-4")

    // Don't allow dropping on the same card that's being dragged
    if (draggedCardRef.current === e.currentTarget) {
      return
    }

    // Set the drop target and show the crafting modal
    setDropTargetObject(targetObject)
    setShowCraftingModal(true)
  }

  const handleObjectClick = (object: any) => {
    setSelectedObject(object)
  }

  const handleAddToSynthesis = () => {
    if (selectedObject) {
      toggleObjectSelection(selectedObject)
      setSelectedObject(null)
    }
  }

  // Add the publish handler
  const handlePublishSynObject = () => {
    if (selectedObject && selectedObject.type === "synObject") {
      toast({
        title: "Published to Marketplace",
        description: `${selectedObject.name} is now available in the marketplace`,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative w-1/3 h-full bg-white border-r-4 border-black overflow-auto">
        <div className="sticky top-0 bg-blue-500 border-b-4 border-black p-4 flex justify-between items-center">
          <h2 className="pixel-text text-white text-lg">MyBox</h2>
          <button onClick={onClose} className="text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-black">
          <button
            className={`flex-1 p-2 pixel-text text-xs ${activeTab === "all" ? "bg-blue-200" : "bg-gray-100"}`}
            onClick={() => setActiveTab("all")}
          >
            All Objects
          </button>
          <button
            className={`flex-1 p-2 pixel-text text-xs ${activeTab === "components" ? "bg-blue-200" : "bg-gray-100"}`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            className={`flex-1 p-2 pixel-text text-xs ${activeTab === "synObjects" ? "bg-blue-200" : "bg-gray-100"}`}
            onClick={() => setActiveTab("synObjects")}
          >
            SynObjects
          </button>
        </div>

        {/* Synthesis area */}
        {activeTab !== "synObjects" && (
          <div className="p-4 border-b-4 border-black">
            <div className="pixel-text text-sm mb-2">Synthesis Area</div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-600">Select up to 3 objects to synthesize</div>
              <button
                className={`game-button px-3 py-1 text-xs ${selectedForSynthesis.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={startSynthesis}
                disabled={selectedForSynthesis.length === 0}
              >
                Publish
              </button>
            </div>

            <div className="flex gap-2 h-20 bg-gray-100 border-2 border-black p-2">
              {selectedForSynthesis.map((obj, index) => (
                <div
                  key={index}
                  className="h-full aspect-square bg-white border-2 border-black flex items-center justify-center relative"
                >
                  {obj.type === "fish" && (
                    <div className="w-8 h-6 relative">
                      <div
                        className="absolute w-3 h-3"
                        style={{ left: "0px", top: "1px", backgroundColor: obj.color }}
                      ></div>
                      <div
                        className="absolute w-3 h-3"
                        style={{ left: "3px", top: "0px", backgroundColor: obj.color }}
                      ></div>
                      <div className="absolute w-1 h-1 bg-black" style={{ left: "4px", top: "1px" }}></div>
                    </div>
                  )}

                  {obj.type === "plant" && (
                    <div className="w-6 h-10 relative">
                      <div
                        className="absolute w-1 h-6"
                        style={{ left: "2px", top: "4px", backgroundColor: obj.color }}
                      ></div>
                      <div
                        className="absolute w-1 h-5"
                        style={{ left: "1px", top: "2px", backgroundColor: obj.color }}
                      ></div>
                    </div>
                  )}

                  {obj.type === "decoration" && (
                    <div className="w-8 h-8 bg-yellow-200 border-2 border-black flex items-center justify-center">
                      <span className="pixel-text text-xs">{obj.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}

                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full"
                    onClick={() => toggleObjectSelection(obj)}
                  >
                    ×
                  </button>
                </div>
              ))}

              {Array(3 - selectedForSynthesis.length)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="h-full aspect-square bg-white border-2 border-dashed border-gray-400 flex items-center justify-center"
                  >
                    <Plus size={16} className="text-gray-400" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Objects list */}
        <div className="p-4">
          <div className="pixel-text text-sm mb-4">
            {activeTab === "all"
              ? "All Objects"
              : activeTab === "components"
                ? "Component Objects"
                : "Synthesized Objects"}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredObjects.map((object) => (
              <div
                key={object.id}
                className={`pixel-card p-3 ${selectedForSynthesis.some((item) => item.id === object.id) ? "border-blue-500 border-4" : ""} cursor-pointer`}
                draggable
                onDragStart={(e) => handleDragStart(e, object)}
                onClick={() => handleObjectClick(object)}
              >
                <div className="w-full aspect-square bg-blue-100 mb-2 flex items-center justify-center">
                  {object.type === "fish" && (
                    <div className="w-12 h-8 relative">
                      <div
                        className="absolute w-4 h-4"
                        style={{ left: "0px", top: "2px", backgroundColor: object.color }}
                      ></div>
                      <div
                        className="absolute w-4 h-4"
                        style={{ left: "4px", top: "0px", backgroundColor: object.color }}
                      ></div>
                      <div className="absolute w-2 h-2 bg-black" style={{ left: "6px", top: "2px" }}></div>
                    </div>
                  )}

                  {object.type === "plant" && (
                    <div className="w-8 h-12 relative">
                      <div
                        className="absolute w-2 h-8"
                        style={{ left: "3px", top: "4px", backgroundColor: object.color }}
                      ></div>
                      <div
                        className="absolute w-2 h-6"
                        style={{ left: "1px", top: "2px", backgroundColor: object.color }}
                      ></div>
                    </div>
                  )}

                  {object.type === "decoration" && (
                    <div className="w-10 h-10 bg-yellow-200 border-2 border-black flex items-center justify-center">
                      <span className="pixel-text text-xs">{object.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}

                  {object.type === "synObject" && <div className="text-4xl">{object.image}</div>}
                </div>

                <div className="pixel-text text-xs">{object.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">{object.type === "synObject" ? "SynObject" : object.type}</div>
                  {object.rarity && (
                    <div
                      className="text-xs"
                      style={{
                        color:
                          object.rarity === "Common"
                            ? "gray"
                            : object.rarity === "Uncommon"
                              ? "green"
                              : object.rarity === "Rare"
                                ? "blue"
                                : object.rarity === "Epic"
                                  ? "purple"
                                  : "orange",
                      }}
                    >
                      {object.rarity}
                    </div>
                  )}
                </div>

                {/* Project badge */}
                {object.projectId && (
                  <div className="mt-1 text-xs bg-gray-100 px-1 inline-block">
                    Project: {object.projectId.replace("project", "")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crafting Modal */}
      {showCraftingModal && (
        <CraftingModal
          objects={selectedForSynthesis}
          onComplete={handleSynthesisComplete}
          onClose={() => setShowCraftingModal(false)}
        />
      )}

      {/* Object Action Modal */}
      {selectedObject && (
        <ObjectActionModal
          object={selectedObject}
          onAddToSynthesis={handleAddToSynthesis}
          onClose={() => setSelectedObject(null)}
          canAddToSynthesis={selectedObject.type !== "synObject"}
          onPublish={handlePublishSynObject}
        />
      )}
    </div>
  )
}

