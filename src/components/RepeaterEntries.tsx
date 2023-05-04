import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'

interface IProps {
  entries:
    | ({
        entryProperties: Queries.RepeaterFragment[]
      } | null)[]
    | null
}

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

// Change name to carousel or something??
const RepeaterEntries: React.FC<IProps> = ({ entries }) => {
  if (!entries) return null

  const data = entries.flatMap((e) =>
    e
      ? [
          e.entryProperties.reduce((acc, property) => {
            if (!property) return acc

            switch (property.__typename) {
              case 'RepeaterPropertyText':
                acc[property.name] = property.text
                break
              case 'RepeaterPropertyRichText':
                acc[property.name] = {
                  richTextRaw: property.richTextRaw,
                  richTextReferences: property.richTextReferences,
                }
                break
              case 'RepeaterPropertyMedia':
                acc[property.name] = property.media
                break
            }
            return acc
          }, {}),
        ]
      : []
  )

  const CarouselSchema = z.array(
    z.object({
      title: z.string(),
      //   richText: {}
    })
  )

  const carouselItems = CarouselSchema.parse(data)

  return (
    <>
      {carouselItems.map((entry, i) => {
        return (
          <div key={i}>
            <h1>{entry.title}</h1>
            {/* {entry?.entryProperties.map((property, j) => {
              switch (property.__typename) {
                case 'RepeaterPropertyText':
                  return <p key={j}>{property.text}</p>
                case 'RepeaterPropertyRichText':
                  if (!property.richTextRaw) return null
                  return (
                    <p key={j}>
                      {renderRichText(
                        {
                          raw: property.richTextRaw,
                          // @ts-ignore
                          references: property.richTextReferences,
                        },
                        options
                      )}
                    </p>
                  )
                case 'RepeaterPropertyMedia':
                  if (!property.media) return null
                  return (
                    <GatsbyImage
                      key={j}
                      alt={'Missing alt'}
                      image={property.media.gatsbyImage!}
                    />
                  )
              }
            })} */}
          </div>
        )
      })}
    </>
  )
}
export default RepeaterEntries
