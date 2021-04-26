import React, { useState } from 'react'
import Canvas from './canvas'

export default function JuliaSet() {

    const [imageState, setImageState] = useState('loading')
    
    return (
        <div>
            <Canvas height={1250} width={1000} />
        </div>
    )
}
