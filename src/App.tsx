import React, { useEffect, useRef, useState } from "react";
import { FabricImage, Canvas, FabricText, Polyline } from "fabric";
import {
  Button,
  Card,
  Checkbox,
  CheckboxChangeEvent,
  Flex,
  Select,
  Typography,
} from "antd";
const { Text } = Typography;
import { Option, OptionGroup, Sticker } from "./interface";
import jobsJson from "./assets/jobs_file_name.json";
import "./App.css";
import {
  addImageToCanvas,
  jobBaseNameToUrl,
  preloadImages,
} from "./CanvasToos";

interface ImageTag {
  image: FabricImage;
  tag: string;
}

// 预设参数
const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = 1920;
const GRID_SIZE = 60;

const BG_LIGHT = "#ededed";
const BG_DARK = "#202020";
const LINE_GRAY = "#888888";

// const jobFiles = jobsFileNameJson as Job[];
const stickers = jobsJson as Sticker[];

let scale = 1;

const ImageEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [imageCache, setImageCache] = useState<
    Record<string, HTMLImageElement>
  >({});

  // 职业选择器的数据
  const [selectOptions, setSelectOptions] = useState<OptionGroup[]>([]);

  // 画布相关引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);

  const [images, setImages] = useState<ImageTag[]>([]);
  const [stickerOptions, setStickerOptions] = useState<Sticker[]>([]);

  const [isVertical, setVertical] = useState<boolean>(true);
  const [isShowGrid, setShowGrid] = useState<boolean>(false);
  const [isDarkMode, setDarkMode] = useState<boolean>(false);
  const [gridLines, setGridLines] = useState<Polyline[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    /**
     * 初始化职业列表
     */
    const optGroupArr: OptionGroup[] = [];
    const jobMap = new Map<string, string[]>();

    for (const className of jobMap.keys()) {
      const optionGroup: OptionGroup = {
        label: className,
        title: className,
        options: [] as Option[],
      };
      jobMap.get(className)?.forEach((v) =>
        optionGroup.options.push({
          label: v,
          value: v,
        }),
      );
      optGroupArr.push(optionGroup);
    }

    setSelectOptions(optGroupArr);

    const opts = stickers
      .filter((s) => s.className === tabListNoTitle[0].key)
      .sort((a, b) =>
        a.jobIndex === b.jobIndex
          ? a.fileIndex - b.fileIndex
          : a.jobIndex - b.jobIndex,
      );
    setStickerOptions(opts);

    /**
     * 初始化画布
     */
    const canvasEleHeight = Math.floor(containerRef.current!.clientHeight);
    scale = canvasEleHeight / DESIGN_HEIGHT;
    console.log(`containerW:${containerRef.current!.clientWidth}`);
    console.log(`containerH:${containerRef.current!.clientHeight}`);
    console.log(`scale:${scale}`);
    const canvas = new Canvas(canvasRef.current, {
      width: DESIGN_WIDTH * scale,
      height: canvasEleHeight,
      backgroundColor: BG_LIGHT,
    });

    // 绑定移动事件实现吸附
    // canvas.on("object:moving", (options) => {
    //   const target = options.target;
    //   if (target) {
    //     // 计算最近的网格点
    //     // Math.round(当前位置 / 网格大小) * 网格大小
    //     const nextLeft = Math.round(target.left / 40) * 40;
    //     const nextTop = Math.round(target.top / 40) * 40;

    //     // 设置新坐标
    //     target.set({
    //       left: nextLeft,
    //       top: nextTop,
    //     });
    //   }
    // });

    /**
     * 加入参考网格
     */
    const lineOptions = {
      stroke: LINE_GRAY,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: "default",
      visible: false,
    };
    const lines: Polyline[] = [];
    // 垂直线
    for (let i = 0; i <= DESIGN_HEIGHT / GRID_SIZE; i++) {
      const pLine = new Polyline(
        [
          { x: i * GRID_SIZE, y: 0 },
          {
            x: i * GRID_SIZE,
            y: DESIGN_HEIGHT,
          },
        ],
        lineOptions,
      );
      canvas.add(pLine);
      lines.push(pLine);
    }
    // 水平线
    for (let i = 0; i <= DESIGN_HEIGHT / GRID_SIZE; i++) {
      const pLine = new Polyline(
        [
          { x: 0, y: i * GRID_SIZE },
          {
            x: DESIGN_HEIGHT,
            y: i * GRID_SIZE,
          },
        ],
        lineOptions,
      );
      canvas.add(pLine);
      lines.push(pLine);
    }
    const verticalLineOptions = {
      stroke: "#4affff",
      scaleY: 3,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: "default",
      visible: false,
    };
    // 用于参考竖屏下面的线
    const verticalBottomLine = new Polyline(
      [
        { x: 0, y: DESIGN_HEIGHT - 220 },
        {
          x: DESIGN_HEIGHT,
          y: DESIGN_HEIGHT - 220,
        },
      ],
      verticalLineOptions,
    );
    canvas.add(verticalBottomLine);
    lines.push(verticalBottomLine);
    // 用于参考竖屏上面的线
    const verticalTopLine = new Polyline(
      [
        { x: 0, y: DESIGN_HEIGHT - 900 },
        {
          x: DESIGN_HEIGHT,
          y: DESIGN_HEIGHT - 900,
        },
      ],
      verticalLineOptions,
    );
    canvas.add(verticalTopLine);
    lines.push(verticalTopLine);
    setGridLines(lines);

    /**
     * 加载中的提示
     */
    const loadingText = new FabricText("加载中", {
      fontSize: 32 / scale,
      fill: LINE_GRAY,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: "default",
      left: canvas.getWidth() / 2 / scale,
      top: canvas.getHeight() / 2 / scale,
      originX: "center",
      originY: "center",
    });
    canvas.add(loadingText);

    /**
     * 预加载图像资源
     */
    const imageUrls: string[] = [];
    jobMap.forEach((baseNames) => {
      baseNames.forEach((baseName) => {
        imageUrls.push(jobBaseNameToUrl(baseName));
      });
    });
    preloadImages(imageUrls).then((images) => {
      const cache: Record<string, HTMLImageElement> = {};
      images.forEach((img, index) => {
        cache[imageUrls[index]] = img;
      });
      setImageCache(cache);
      setLoading(false);
      canvas.remove(loadingText);
    });

    canvas.setZoom(scale);
    fabricCanvas.current = canvas;
    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, []);

  /**
   * 处理多选职业
   * @param options 职业列表
   */
  const handleSelectJobs = (options: string[]) => {
    // 如果什么都没选，清空画布
    // if (options.length === 0) {
    //   images.forEach(({ image }) => {
    //     fabricCanvas.current?.remove(image);
    //   });
    //   fabricCanvas.current?.renderAll();
    //   setImages([]);
    //   return;
    // }
    // // 判断当前选择图片是否已显示，如果没显示，则添加
    // const imgs: ImageTag[] = [...images];
    // options.forEach((picName) => {
    //   let findInCanvas = false;
    //   images.forEach((v) => {
    //     if (v.tag === picName) {
    //       findInCanvas = true;
    //     }
    //   });
    //   if (!findInCanvas) {
    //     const count = Number(picName.slice(-1));
    //     const y =
    //       count === 2 ? DESIGN_HEIGHT - 220 - 150 : DESIGN_HEIGHT - 930 - 150;
    //     const img = addImageToCanvas(
    //       fabricCanvas.current!,
    //       imageCache[`./jobs/${picName}.png`],
    //       isVertical ? DESIGN_WIDTH / 2 : DESIGN_HEIGHT / 2,
    //       isVertical ? y : DESIGN_HEIGHT / 2,
    //     );
    //     imgs.push({
    //       image: img,
    //       tag: picName,
    //     } as ImageTag);
    //   }
    // });
    // // 判断当前显示的图片是否有被选中，如果没有选中，则删除
    // const result = imgs.filter((v) => {
    //   if (!options.includes(v.tag)) {
    //     removeImageFromCanvas(fabricCanvas.current, v.image);
    //     return false;
    //   } else {
    //     return true;
    //   }
    // });
    // setImages(result);
  };

  /**
   * 切换暗色模式
   * @param e checkbox事件
   */
  const handleSetDarkMode = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setDarkMode(e.target.checked);
    if (e.target.checked) {
      canvas.backgroundColor = BG_DARK;
      canvas.contextContainer.filter = "brightness(0.75)";
    } else {
      canvas.backgroundColor = BG_LIGHT;
      canvas.contextContainer.filter = "brightness(1)";
    }
    canvas.renderAll();
  };

  /**
   * 显示参考网格
   * @param e checkbox 事件
   */
  const handleSetGrid = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setShowGrid(e.target.checked);
    gridLines.forEach((v) => {
      v.visible = e.target.checked;
    });
    canvas.renderAll();
  };

  /**
   * 处理切换横竖屏
   */
  const handleSetVertical = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setVertical(e.target.checked);
    if (e.target.checked) {
      canvas.setDimensions({
        width: DESIGN_WIDTH * scale,
      });
    } else {
      canvas.setDimensions({
        width: canvas.height,
      });
    }
    canvas.renderAll();
  };

  /**
   * 导出图片
   * @returns
   */
  const handleExport = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // 如果显示了参考线，先隐藏，之后再显示出来
    if (isShowGrid) {
      gridLines.forEach((line) => {
        line.visible = false;
      });
    }

    // 计算缩放倍数
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: DESIGN_HEIGHT / canvas.height,
    });

    // 下载图片
    const link = document.createElement("a");
    link.download = `职业小人贴贴乐${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (isShowGrid) {
      gridLines.forEach((line) => {
        line.visible = true;
      });
    }
    canvas.renderAll();
  };
  const tabListNoTitle = [
    {
      key: "防护职业",
      label: "防护职业",
    },
    {
      key: "治疗职业",
      label: "治疗职业",
    },
    {
      key: "近战职业",
      label: "近战职业",
    },
    {
      key: "远程职业",
      label: "远程职业",
    },
    {
      key: "其他",
      label: "其他",
    },
  ];

  const [activeTabKey, setActiveTabKey] = useState<string>(
    tabListNoTitle[0].key,
  );

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
    const opts = stickers
      .filter((s) => s.className === key)
      .sort((a, b) =>
        a.jobIndex === b.jobIndex
          ? a.fileIndex - b.fileIndex
          : a.jobIndex - b.jobIndex,
      );
    setStickerOptions(opts);
  };
  const handleOnStickerClick = (e: HTMLImageElement, sticker: Sticker) => {
    const y =
      sticker.fileIndex === 2
        ? DESIGN_HEIGHT - 220 - 150
        : DESIGN_HEIGHT - 930 - 150;
    addImageToCanvas(
      fabricCanvas.current!,
      `./jobs/${sticker.fileName}`,
      isVertical ? DESIGN_WIDTH / 2 : DESIGN_HEIGHT / 2,
      isVertical ? y : DESIGN_HEIGHT / 2,
    );
  };

  return (
    <div className="container" style={{ width: "100%" }}>
      {/* 画布 */}
      <div
        ref={containerRef}
        style={{
          height: "80vh",
        }}
      >
        <canvas
          style={{
            border: "1px solid #cccccc",
            boxShadow: "0 0 5px rgba(0,0,0,0.1)",
          }}
          ref={canvasRef}
        />
      </div>

      {/* 操作按钮 */}
      <Flex
        justify="flex-start"
        vertical
        style={{
          width: "500px",
        }}
      >
        <Flex justify="flex-start" gap="middle" vertical>
          {/* <Select
            showSearch={false}
            disabled={loading}
            mode="multiple"
            allowClear
            placement="bottomLeft"
            onChange={handleSelectJobs}
            options={selectOptions}
          /> */}
          <Card
            tabList={tabListNoTitle}
            activeTabKey={activeTabKey}
            onTabChange={onTabChange}
            style={{ textAlign: "start" }}
            tabProps={{
              size: "small",
            }}
          >
            {stickerOptions.map((v) => (
              <img
                className="sticker"
                key={`${v.jobIndex}-${v.fileIndex}`}
                draggable={false}
                src={`./jobs/${v.coverFileName}`}
                onClick={(e) => {
                  handleOnStickerClick(e.currentTarget, v);
                }}
              />
            ))}
          </Card>
          <Checkbox checked={isShowGrid} onChange={handleSetGrid}>
            {"显示参考网格"}
          </Checkbox>
          <Checkbox checked={isDarkMode} onChange={handleSetDarkMode}>
            {"暗色模式"}
          </Checkbox>
          <Checkbox checked={isVertical} onChange={handleSetVertical}>
            {"竖屏模式"}
          </Checkbox>
          <Button type="primary" onClick={handleExport}>
            保存图片
          </Button>
          <Flex justify="flex-start" vertical>
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              绘制 by 不正雀 网页 by Nel
            </Text>
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              无偿分享，严禁盗用、无料印刷、私自商用等
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </div>
  );
};

export default ImageEditor;
