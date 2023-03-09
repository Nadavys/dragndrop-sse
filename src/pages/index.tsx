
import React, { useState, useEffect } from 'react';

import intialSlides, { slideType } from '@/initialSlides';

import { ActionButtonS } from '@/components/ActionsButtons';
import styles from '@/styles/styles';

const SLIDES_ENDPOINT = '/api/slides'
enum Position {
  BEFORE,
  AFTER
}

type MessageType = {domain:string, version: number};

export default function Home() {
  const [slides, setsSlides] = useState<slideType[]>([]);
  const [currentSlideVersion, setSlideVersion] = useState<number>(-1); //track current version of slides
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setdragOverItemIndex] = useState<number | null>(null);
  const [beforeOrAfter, setBeforeOrAfter] = useState<Position | null>(null);

  const [previousStates, setPreviousStates] = useState<slideType[][]>([])
  const [SSE, setSSE] = useState<EventSource | null>(null)

  const slideContainerRef = React.useRef<HTMLElement>(null);

  const fetchSlides = async () => {
    const data = await (await fetch(SLIDES_ENDPOINT)).json();
    if (data.version > currentSlideVersion) {
      setsSlides(data.slides)
      setSlideVersion(data.version);
    }
  }

  const mutateSlides = async (slides: slideType[]) => {
    const response = await fetch(SLIDES_ENDPOINT, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slides),
    });
    const dataResponse = await response.json();
    setSlideVersion(dataResponse.version);
    console.log("new version", dataResponse.version)
  }


  const handleRealtimeData = async (data: MessageType) => {
    console.log("^^ data.version", data.version, { currentSlideVersion }, { slides })
    if (data.domain === 'slides' && data.version > currentSlideVersion) {
      console.log("reload slides version", data.version)
      fetchSlides();
    }
  }

  useEffect(() => {
    fetchSlides();

    const sse = new EventSource(`/api/subscribe`);
    setSSE(sse)

    return () => {
      sse.close();
    };

  }, []);



  useEffect(() => {

    if (SSE) {
      SSE.onmessage = function (e: any) {
        console.log("---", { slides })
        handleRealtimeData(JSON.parse(e.data));
      }
      SSE.onerror = (e: any) => {
        console.error(e)

        SSE.close();
      }
    }


  }, [SSE, currentSlideVersion]);

  ///---handlers


  const handleDragStart = (event: React.DragEvent<HTMLElement>, index: number) => {
    setDragItemIndex(index)
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const containerRect = slideContainerRef.current!.getBoundingClientRect()

    //move scroll when on top/bottom to enable viewing all slides in viewport
    const y_relativeToContainer = e.clientY - containerRect.top;
    if (y_relativeToContainer < 150) {
      slideContainerRef.current?.scrollBy({
        top: -200,
        behavior: "smooth",
      })
    }

    if (containerRect.height - y_relativeToContainer < 150) {
      slideContainerRef.current?.scrollBy({
        top: 200,
        behavior: "smooth",
      })
    }

    //------

    const draggedOverElement = e.target;
    //@ts-ignore
    const targetRect = draggedOverElement.getBoundingClientRect();

    const y_relativeToTarget = e.clientY - targetRect.top
    const mid_y_axis = Math.floor(targetRect.height / 2);

    const direction = mid_y_axis - y_relativeToTarget > 0 ? Position.BEFORE : Position.AFTER;
    setBeforeOrAfter(direction);


  }

  const handleDrop = (index: number) => {
    //for undo, shallow copy current state
    setPreviousStates([slides.slice(), ...previousStates])
    console.log(`move from ${dragItemIndex} to ${dragOverItemIndex} ${((beforeOrAfter === Position.BEFORE) ? 'before' : 'after')}`);
    //adjustments
    let targetIndex = dragOverItemIndex! + ((beforeOrAfter === Position.BEFORE) ? -1 : 0);
    if (dragItemIndex! > targetIndex) {
      targetIndex++;
    }

    const temp = [...slides]
    //get removed item
    const draggedSlide = temp.splice(dragItemIndex!, 1)[0];
    //place item in the correct location
    temp.splice(targetIndex, 0, draggedSlide);
    setsSlides(temp);
    mutateSlides(temp);
  }

  const handleDragLeave = () => {
    setdragOverItemIndex(null);
  }

  const handleDragEnter = (index: number) => {
    setdragOverItemIndex(index)
  }

  const handleDragEnd = () => {
    setDragItemIndex(null);
    setdragOverItemIndex(null);
    setBeforeOrAfter(null);
  }


  const handleUndo = () => {
    if (previousStates.length === 0) {
      alert("Error: no preview states");
      return;
    }

    const temp = previousStates.slice(); //cant manipulate an immutable object
    const lastState = temp.shift();

    setPreviousStates(temp);

    setsSlides(lastState as slideType[]);
    mutateSlides(lastState as slideType[]);
  }


  const handleReset = () => {
    setsSlides(intialSlides);
    setPreviousStates([]);
    mutateSlides(intialSlides);
  }

  return (
    <div id="app">
      <ActionButtonS onClickUndo={handleUndo} onClickReset={handleReset} disabled={previousStates.length === 0} />
      <div style={styles.containerStyle} id="container"
        ref={slideContainerRef as React.RefObject<HTMLDivElement>}
      >

        {slides.map(
          (slide: slideType, index) => (

            <div style={styles.slideContainerStyle} key={slide.id}
              className={(index === dragOverItemIndex) ? ((beforeOrAfter === Position.AFTER) ? "target-after" : "target-before") : ""}
            >

              <div className={`slide${slide.id}`} style={styles.slideStyle}
                draggable
                onDragStart={(event) => handleDragStart(event, index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
              >
                {slide.title}

              </div>
            </div>
          )
        )}

      </div>
    </div>
  )
}
