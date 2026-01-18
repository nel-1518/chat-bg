import { Canvas, Control, FabricImage } from "fabric";

export const preloadImages = (urls: string[]): Promise<HTMLImageElement[]> => {
  const promises = urls.map((url) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(`Failed to load image: ${url}`);
      img.src = url;
      // 处理跨域问题（如果图片在不同域名下）
      img.crossOrigin = 'anonymous';
    });
  });
  return Promise.all(promises);
};

export const jobBaseNameToUrl = (baseName: string): string => {
  return `./jobs/${baseName}.png`;
}

/**
 * 导入图片到指定位置
 */
export const addImageToCanvas = (
  canvas: Canvas,
  imageElement: HTMLImageElement,
  left: number,
  top: number,
): FabricImage => {

  const imgElement = document.createElement('img');
  imgElement.src = "./delete.png";

  const img = new FabricImage(imageElement, {
    controls: {
      ...FabricImage.createControls().controls,
      mySpecialControl: new Control({
        x: 0,
        y: 0.5,
        cursorStyle: "pointer",
        mouseUpHandler: (e, trans) => {
          canvas.remove(trans.target);
          canvas.requestRenderAll();
          return true;
        },
        render: (ctx, left, top) => {
          const size = 25; // 图标大小
          ctx.save();
          ctx.translate(left, top);
          ctx.drawImage(imgElement, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }),
    }
  });

  // 设置位置和缩放（可选）
  img.set({
    left: left,
    top: top,
    angle: 0,
    lockRotation: true, // 禁止旋转
  });
  img.setControlsVisibility({
    // 隐藏上下左右控制点，防止拉伸变形
    mt: false,
    mb: false,
    ml: false,
    mr: false,
    mtr: false, // 隐藏旋转手柄
    // 保留四个角点，用于等比缩放
    tl: true,
    tr: true,
    bl: true,
    br: true,
  });


  img.set({
    perPixelTargetFind: true,
    targetFindTolerance: 4
  })

  // 图像点击后置顶
  img.on("mousedown", () => {
    canvas.bringObjectToFront(img);
  });

  // 添加到画布并渲染
  canvas.add(img);
  // canvas.setActiveObject(img); // 选中该图片
  canvas.renderAll();
  return img;
};

export const removeImageFromCanvas = async (canvas: Canvas | null, image: FabricImage) => {
  if (!canvas) return;
  canvas.remove(image);
  canvas.renderAll();
};