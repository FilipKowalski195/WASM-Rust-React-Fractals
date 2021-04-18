import React, { useState } from 'react'

import photo from '../imgs/julia.png'
export default function JuliaSet() {

    const [imageState, setImageState] = useState('loading')
    
    return (
        <div>
            <img
                src={photo}
            /> 
        </div>
    )
}
