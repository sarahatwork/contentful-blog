import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'
import FacebookIcon from '@iconscout/react-unicons/icons/uil-facebook'
import InstagramIcon from '@iconscout/react-unicons/icons/uil-instagram'
import StarIcon from '@iconscout/react-unicons/icons/uil-star'
import { Link } from 'gatsby'
interface IProps {
  items: ReadonlyArray<{
    entryProperties: ReadonlyArray<Queries.RepeaterFragment>
  } | null>
}

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

const SocialMedia: React.FC<IProps> = ({ items }) => {
  if (!items) return null

  const data = items.flatMap((e) =>
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
                  raw: property.richTextRaw,
                  references: property.richTextReferences,
                }
                break
              case 'RepeaterPropertyMedia':
                acc[property.name] = property.media
                break
              case 'RepeaterPropertyBoolean':
                acc[property.name] = !!property.boolean
                break
            }
            return acc
          }, {}),
        ]
      : []
  )

  const SocialMediaSchema = z.array(
    z.object({
      network: z.string(),
      url: z.string(),
    })
  )

  const socialItems = SocialMediaSchema.parse(data)

  return (
    <ul>
      {socialItems.map((item, i) => {
        switch (item.network) {
          case 'Facebook':
            return (
              <li key={i}>
                <a href={item.url}>
                  Facebook <FacebookIcon />
                </a>
              </li>
            )
          case 'Instagram':
            return (
              <li key={i}>
                <a href={item.url}>
                  Instagram <InstagramIcon />
                </a>
              </li>
            )
          case "Dog's Instagram":
            return (
              <li key={i}>
                <a href={item.url}>
                  Dog's Instagram <StarIcon />
                </a>
              </li>
            )
        }
      })}
    </ul>
  )
}
export default SocialMedia
