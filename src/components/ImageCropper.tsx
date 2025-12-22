import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import getCroppedImg from '@/lib/cropImage'
import { Loader2 } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedImageBlob: Blob) => void
}

export function ImageCropper({ imageSrc, open, onOpenChange, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    
    try {
      setIsLoading(true)
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedImage) {
        onCropComplete(croppedImage)
        onOpenChange(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="relative h-[300px] w-full bg-black/5 rounded-md overflow-hidden mt-4">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={onZoomChange}
            />
          )}
        </div>
        <div className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Zoom</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
